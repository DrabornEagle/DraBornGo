import { supabase } from '../lib/supabase';

function normalizeRpcError(error) {
  const raw = String(error?.message || error?.details || error?.hint || error || '').trim();
  const lower = raw.toLowerCase();

  if (!raw) return 'İşlem şu anda tamamlanamadı.';
  if (lower.includes('dkd_social_') || lower.includes('function') || lower.includes('does not exist')) {
    return 'Sohbet ve Ally altyapısı veritabanında hazır görünmüyor. Yeni SQL dosyasını Supabase üzerinde çalıştırman gerekiyor.';
  }
  if (lower.includes('friend_exists')) return 'Bu oyuncu zaten arkadaş listende.';
  if (lower.includes('request_exists')) return 'Bu oyuncuya zaten bekleyen istek gönderdin.';
  if (lower.includes('cannot_friend_self')) return 'Kendine arkadaş isteği gönderemezsin.';
  if (lower.includes('thread_forbidden')) return 'Bu sohbet odasına erişim iznin yok.';
  if (lower.includes('message_empty')) return 'Mesaj boş olamaz.';
  if (lower.includes('friendship_not_found')) return 'Bu oyuncuyla aktif bir arkadaşlık bulunamadı.';
  if (lower.includes('blocked_relationship')) return 'Bu kullanıcıyla bağlantı engellendi. Mesaj ve arkadaşlık isteği gönderilemez.';
  if (lower.includes('cannot_block_self')) return 'Kendini engelleyemezsin.';
  if (lower.includes('cannot_report_self')) return 'Kendini şikayet edemezsin.';
  if (lower.includes('admin_required')) return 'Bu moderasyon alanı için admin yetkisi gerekiyor.';
  if (lower.includes('target_not_found')) return 'Aradığın oyuncu bulunamadı.';
  if (lower.includes('not_request_target')) return 'Bu arkadaşlık isteği üzerinde işlem yetkin yok.';
  if (lower.includes('ally_id')) return '6 haneli otomatik Ally_ID altyapısı için SQL dosyası uygulanmalı.';
  return raw;
}

export function getAllyFriendlyError(error) {
  return normalizeRpcError(error);
}

export async function touchAllyPresence() {
  return supabase.rpc('dkd_social_touch_presence');
}

export async function fetchAllySnapshot() {
  const res = await supabase.rpc('dkd_social_snapshot');
  if (res?.error) return res;
  return {
    ...res,
    data: {
      myProfile: res?.data?.myProfile || null,
      friends: Array.isArray(res?.data?.friends) ? res.data.friends : [],
      incoming: Array.isArray(res?.data?.incoming) ? res.data.incoming : [],
      outgoing: Array.isArray(res?.data?.outgoing) ? res.data.outgoing : [],
    },
  };
}

export async function searchAllyProfiles(query, limit = 12) {
  return supabase.rpc('dkd_social_search_profiles', {
    dkd_param_query: String(query || '').trim(),
    dkd_param_limit: Math.max(1, Math.min(20, Number(limit || 12))),
  });
}

export async function sendFriendRequest(targetUserId) {
  return supabase.rpc('dkd_social_send_friend_request', {
    dkd_param_target_user_id: targetUserId,
  });
}

export async function respondFriendRequest(requestId, action) {
  return supabase.rpc('dkd_social_respond_friend_request', {
    dkd_param_request_id: Number(requestId),
    dkd_param_action: String(action || 'accept').trim().toLowerCase(),
  });
}

export async function removeFriend(friendUserId) {
  return supabase.rpc('dkd_social_remove_friend', {
    dkd_param_friend_user_id: friendUserId,
  });
}

export async function getOrCreateDirectThread(friendUserId) {
  return supabase.rpc('dkd_social_get_or_create_thread', {
    dkd_param_friend_user_id: friendUserId,
  });
}

export async function fetchThreadMessages(threadId, limit = 80) {
  return supabase.rpc('dkd_social_thread_messages', {
    dkd_param_thread_id: threadId,
    dkd_param_limit: Math.max(10, Math.min(150, Number(limit || 80))),
  });
}

export async function sendThreadMessage(threadId, body) {
  return supabase.rpc('dkd_social_send_message', {
    dkd_param_thread_id: threadId,
    dkd_param_body: String(body || '').trim(),
  });
}

export async function markThreadSeen(threadId) {
  return supabase.rpc('dkd_social_mark_thread_seen', {
    dkd_param_thread_id: threadId,
  });
}

export async function dkd_block_social_user_value(dkd_target_user_id_value, dkd_reason_text_value = 'dkd_user_blocked') {
  return supabase.rpc('dkd_social_block_user', {
    dkd_param_target_user_id: dkd_target_user_id_value,
    dkd_param_reason_text: String(dkd_reason_text_value || 'dkd_user_blocked').trim(),
  });
}

export async function dkd_report_social_user_value(dkd_target_user_id_value, dkd_reason_key_value = 'dkd_inappropriate_content', dkd_detail_text_value = '', dkd_context_value = {}) {
  return supabase.rpc('dkd_social_report_user', {
    dkd_param_target_user_id: dkd_target_user_id_value,
    dkd_param_reason_key: String(dkd_reason_key_value || 'dkd_inappropriate_content').trim(),
    dkd_param_detail_text: String(dkd_detail_text_value || '').trim(),
    dkd_param_thread_id: dkd_context_value?.dkd_thread_id_value || null,
    dkd_param_message_id: dkd_context_value?.dkd_message_id_value || null,
  });
}

export async function dkd_fetch_social_moderation_queue_value(dkd_status_key_value = 'dkd_open', dkd_limit_value = 80) {
  return supabase.rpc('dkd_social_admin_moderation_queue', {
    dkd_param_status_key: String(dkd_status_key_value || 'dkd_open').trim(),
    dkd_param_limit: Math.max(1, Math.min(200, Number(dkd_limit_value || 80))),
  });
}

export async function dkd_update_social_moderation_report_value(dkd_report_id_value, dkd_status_key_value, dkd_admin_note_text_value = '') {
  return supabase.rpc('dkd_social_admin_update_report_status', {
    dkd_param_report_id: Number(dkd_report_id_value),
    dkd_param_status_key: String(dkd_status_key_value || 'dkd_reviewing').trim(),
    dkd_param_admin_note_text: String(dkd_admin_note_text_value || '').trim(),
  });
}
