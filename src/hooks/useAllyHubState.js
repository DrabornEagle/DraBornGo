import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import {
  dkd_block_social_user_value,
  dkd_report_social_user_value,
  fetchAllySnapshot,
  fetchThreadMessages,
  getAllyFriendlyError,
  getOrCreateDirectThread,
  markThreadSeen,
  removeFriend,
  respondFriendRequest,
  searchAllyProfiles,
  sendFriendRequest,
  sendThreadMessage,
  touchAllyPresence,
} from '../services/allyService';

const EMPTY_SNAPSHOT = Object.freeze({
  myProfile: null,
  friends: [],
  incoming: [],
  outgoing: [],
});

function sumUnread(rows = []) {
  return (Array.isArray(rows) ? rows : []).reduce((total, row) => total + Number(row?.unread_count || 0), 0);
}

export function useAllyHubState({ sessionUserId, visible, profile, refreshProfile }) {
  const [loading, setLoading] = useState(false);
  const [dbReady, setDbReady] = useState(true);
  const [dbMessage, setDbMessage] = useState('');
  const [snapshot, setSnapshot] = useState(EMPTY_SNAPSHOT);
  const [searchText, setSearchText] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [messages, setMessages] = useState([]);
  const [sending, setSending] = useState(false);
  const [dkd_moderation_saving_value, dkd_set_moderation_saving_value] = useState(false);

  const myAllyId = useMemo(() => {
    const raw = profile?.ally_id ?? snapshot?.myProfile?.ally_id ?? null;
    return raw == null ? '—' : String(raw).replace(/\D/g, '').padStart(6, '0');
  }, [profile?.ally_id, snapshot?.myProfile?.ally_id]);

  const unreadTotal = useMemo(() => sumUnread(snapshot?.friends), [snapshot?.friends]);

  const refreshSnapshot = useCallback(async ({ silent = false } = {}) => {
    if (!sessionUserId) {
      setSnapshot(EMPTY_SNAPSHOT);
      setSearchResults([]);
      setActiveChat(null);
      return EMPTY_SNAPSHOT;
    }

    if (!silent) setLoading(true);
    const { data, error } = await fetchAllySnapshot();
    if (error) {
      const message = getAllyFriendlyError(error);
      setDbReady(false);
      setDbMessage(message);
      if (!silent) setSnapshot(EMPTY_SNAPSHOT);
      if (!silent) setLoading(false);
      return null;
    }

    setDbReady(true);
    setDbMessage('');
    const next = data || EMPTY_SNAPSHOT;
    setSnapshot(next);
    if (activeChat?.user_id) {
      const refreshed = (next.friends || []).find((row) => String(row?.user_id) === String(activeChat.user_id));
      if (refreshed) {
        setActiveChat((prev) => ({ ...(prev || {}), ...refreshed, thread_id: refreshed?.thread_id || prev?.thread_id || null }));
      }
    }
    if (!silent) setLoading(false);
    return next;
  }, [activeChat?.user_id, sessionUserId]);

  const loadMessages = useCallback(async (threadId, options = {}) => {
    if (!threadId) {
      setMessages([]);
      return [];
    }
    const silent = !!options.silent;
    if (!silent) setMessagesLoading(true);
    const { data, error } = await fetchThreadMessages(threadId, 120);
    if (error) {
      const message = getAllyFriendlyError(error);
      if (!silent) Alert.alert('Ally Sohbet', message);
      if (!silent) setMessagesLoading(false);
      return [];
    }
    const rows = Array.isArray(data) ? data.slice().sort((dkd_left_item, dkd_right_item) => new Date(dkd_left_item.created_at) - new Date(dkd_right_item.created_at)) : [];
    setMessages(rows);
    if (!silent) setMessagesLoading(false);
    return rows;
  }, []);

  const openThread = useCallback(async (friendRow) => {
    if (!friendRow?.user_id) return;
    const currentThreadId = friendRow?.thread_id || null;
    let threadId = currentThreadId;

    if (!threadId) {
      const { data, error } = await getOrCreateDirectThread(friendRow.user_id);
      if (error) {
        Alert.alert('Ally Sohbet', getAllyFriendlyError(error));
        return;
      }
      threadId = data;
    }

    const nextChat = { ...friendRow, thread_id: threadId };
    setActiveChat(nextChat);
    await Promise.all([
      loadMessages(threadId),
      markThreadSeen(threadId),
      refreshSnapshot({ silent: true }),
    ]);
  }, [loadMessages, refreshSnapshot]);

  const closeThread = useCallback(() => {
    setActiveChat(null);
    setMessages([]);
  }, []);

  const runSearch = useCallback(async (input) => {
    const query = String(input ?? searchText).trim();
    setSearchText(query);

    const digitCount = query.replace(/\D/g, '').length;
    if (!query || (query.length < 2 && digitCount < 6)) {
      setSearchResults([]);
      return [];
    }

    setSearching(true);
    const { data, error } = await searchAllyProfiles(query, 12);
    setSearching(false);

    if (error) {
      Alert.alert('Ally Arama', getAllyFriendlyError(error));
      return [];
    }

    const rows = Array.isArray(data) ? data : [];
    setSearchResults(rows);
    return rows;
  }, [searchText]);

  const handleSendRequest = useCallback(async (targetUserId) => {
    const { data, error } = await sendFriendRequest(targetUserId);
    if (error) {
      Alert.alert('Arkadaş Ekle', getAllyFriendlyError(error));
      return false;
    }
    if (data?.ok === false) {
      Alert.alert('Arkadaş Ekle', getAllyFriendlyError(data?.reason || 'İstek gönderilemedi.'));
      return false;
    }
    Alert.alert('Arkadaş Ekle', data?.reason === 'accepted_existing' ? 'Karşı taraftan bekleyen istek kabul edildi. Artık arkadaşsınız.' : 'İstek gönderildi.');
    await Promise.all([refreshSnapshot({ silent: true }), refreshProfile?.()]);
    return true;
  }, [refreshProfile, refreshSnapshot]);

  const handleRespondRequest = useCallback(async (requestId, action) => {
    const { data, error } = await respondFriendRequest(requestId, action);
    if (error) {
      Alert.alert('Arkadaşlık İsteği', getAllyFriendlyError(error));
      return false;
    }
    if (data?.ok === false) {
      Alert.alert('Arkadaşlık İsteği', getAllyFriendlyError(data?.reason || 'İşlem tamamlanamadı.'));
      return false;
    }
    await refreshSnapshot({ silent: true });
    return true;
  }, [refreshSnapshot]);

  const handleRemoveFriend = useCallback(async (friendUserId) => {
    const { data, error } = await removeFriend(friendUserId);
    if (error) {
      Alert.alert('Ally', getAllyFriendlyError(error));
      return false;
    }
    if (data?.ok === false) {
      Alert.alert('Ally', getAllyFriendlyError(data?.reason || 'Arkadaş kaldırılamadı.'));
      return false;
    }
    if (String(activeChat?.user_id || '') === String(friendUserId || '')) {
      closeThread();
    }
    await refreshSnapshot({ silent: true });
    return true;
  }, [activeChat?.user_id, closeThread, refreshSnapshot]);

  const handleSendMessage = useCallback(async (body) => {
    const text = String(body || '').trim();
    if (!text || !activeChat?.thread_id) return false;
    setSending(true);
    const { data, error } = await sendThreadMessage(activeChat.thread_id, text);
    setSending(false);
    if (error) {
      Alert.alert('Mesaj', getAllyFriendlyError(error));
      return false;
    }
    if (data?.ok === false) {
      Alert.alert('Mesaj', getAllyFriendlyError(data?.reason || 'Mesaj gönderilemedi.'));
      return false;
    }
    await Promise.all([
      loadMessages(activeChat.thread_id, { silent: true }),
      refreshSnapshot({ silent: true }),
      touchAllyPresence(),
    ]);
    return true;
  }, [activeChat?.thread_id, loadMessages, refreshSnapshot]);

  const dkd_run_report_submit_value = useCallback(async (dkd_target_user_id_value, dkd_reason_key_value, dkd_detail_text_value = '', dkd_context_value = {}) => {
    if (!dkd_target_user_id_value) return false;
    dkd_set_moderation_saving_value(true);
    const { data, error } = await dkd_report_social_user_value(
      dkd_target_user_id_value,
      dkd_reason_key_value,
      dkd_detail_text_value,
      dkd_context_value,
    );
    dkd_set_moderation_saving_value(false);

    if (error) {
      Alert.alert('Şikayet', getAllyFriendlyError(error));
      return false;
    }

    if (data?.ok === false) {
      Alert.alert('Şikayet', getAllyFriendlyError(data?.reason || 'Şikayet gönderilemedi.'));
      return false;
    }

    Alert.alert('Şikayet alındı', 'Rapor admin moderasyon kuyruğuna gönderildi. Gerekirse bu kullanıcıyı ayrıca engelleyebilirsin.');
    return true;
  }, []);

  const dkd_report_user_value = useCallback((dkd_target_row_value, dkd_context_value = {}) => {
    const dkd_target_user_id_value = dkd_target_row_value?.user_id || dkd_target_row_value?.dkd_reported_user_id || null;
    if (!dkd_target_user_id_value) return false;
    const dkd_target_name_value = dkd_target_row_value?.nickname || dkd_target_row_value?.dkd_reported_nickname || 'Oyuncu';
    const dkd_report_context_value = {
      dkd_thread_id_value: dkd_context_value?.dkd_thread_id_value || dkd_target_row_value?.thread_id || activeChat?.thread_id || null,
      dkd_message_id_value: dkd_context_value?.dkd_message_id_value || null,
    };

    Alert.alert('Kullanıcıyı şikayet et', `${dkd_target_name_value} için moderasyon raporu oluşturulsun mu?`, [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Spam',
        onPress: () => dkd_run_report_submit_value(dkd_target_user_id_value, 'dkd_spam', 'Kullanıcı spam veya istenmeyen mesaj gönderdi.', dkd_report_context_value),
      },
      {
        text: 'Uygunsuz',
        onPress: () => dkd_run_report_submit_value(dkd_target_user_id_value, 'dkd_inappropriate_content', 'Uygunsuz kullanıcı davranışı veya içerik bildirildi.', dkd_report_context_value),
      },
    ]);

    return true;
  }, [activeChat?.thread_id, dkd_run_report_submit_value]);

  const dkd_block_user_value = useCallback((dkd_target_row_value) => {
    const dkd_target_user_id_value = dkd_target_row_value?.user_id || null;
    if (!dkd_target_user_id_value) return false;
    const dkd_target_name_value = dkd_target_row_value?.nickname || 'Oyuncu';

    Alert.alert('Kullanıcıyı engelle', `${dkd_target_name_value} engellensin mi? Bu kullanıcı sana mesaj ve arkadaşlık isteği gönderemez. Mevcut arkadaşlık ve bekleyen istekler kapanır.`, [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Engelle',
        style: 'destructive',
        onPress: async () => {
          dkd_set_moderation_saving_value(true);
          const { data, error } = await dkd_block_social_user_value(dkd_target_user_id_value, 'dkd_user_blocked_from_social_hub');
          dkd_set_moderation_saving_value(false);

          if (error) {
            Alert.alert('Engelle', getAllyFriendlyError(error));
            return;
          }

          if (data?.ok === false) {
            Alert.alert('Engelle', getAllyFriendlyError(data?.reason || 'Kullanıcı engellenemedi.'));
            return;
          }

          if (String(activeChat?.user_id || '') === String(dkd_target_user_id_value || '')) {
            closeThread();
          }

          setSearchResults((dkd_previous_rows_value) => (Array.isArray(dkd_previous_rows_value) ? dkd_previous_rows_value.filter((dkd_result_row_value) => String(dkd_result_row_value?.user_id || '') !== String(dkd_target_user_id_value)) : []));
          await refreshSnapshot({ silent: true });
          Alert.alert('Engellendi', 'Bu kullanıcı artık sana mesaj veya arkadaşlık isteği gönderemez.');
        },
      },
    ]);

    return true;
  }, [activeChat?.user_id, closeThread, refreshSnapshot]);


  useEffect(() => {
    if (!visible || !sessionUserId) return undefined;
    let active = true;

    (async () => {
      await touchAllyPresence();
      const next = await refreshSnapshot();
      if (!active) return;
      if (!activeChat?.user_id && Array.isArray(next?.friends) && next.friends.length === 1 && Number(next.friends[0]?.unread_count || 0) > 0) {
        openThread(next.friends[0]);
      }
    })();

    const timer = setInterval(() => {
      touchAllyPresence();
      refreshSnapshot({ silent: true });
    }, 9000);

    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [activeChat?.user_id, openThread, refreshSnapshot, sessionUserId, visible]);

  useEffect(() => {
    if (!visible || !activeChat?.thread_id) return undefined;
    markThreadSeen(activeChat.thread_id);
    loadMessages(activeChat.thread_id);
    const timer = setInterval(() => {
      loadMessages(activeChat.thread_id, { silent: true });
      markThreadSeen(activeChat.thread_id);
    }, 5000);
    return () => clearInterval(timer);
  }, [activeChat?.thread_id, loadMessages, visible]);

  return {
    loading,
    dbReady,
    dbMessage,
    snapshot,
    myAllyId,
    unreadTotal,
    refreshSnapshot,
    searchText,
    setSearchText,
    searching,
    searchResults,
    runSearch,
    activeChat,
    setActiveChat,
    closeThread,
    openThread,
    messagesLoading,
    messages,
    sending,
    dkd_moderation_saving_value,
    sendMessage: handleSendMessage,
    dkd_report_user_value,
    dkd_block_user_value,
    sendFriendRequest: handleSendRequest,
    respondFriendRequest: handleRespondRequest,
    removeFriend: handleRemoveFriend,
  };
}

export default useAllyHubState;
